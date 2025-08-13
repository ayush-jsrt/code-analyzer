resource "aws_instance" "web" {
    ami = "ami-0a84ffe13366e143f"
    instance_type = "t3.medium"
    key_name = "ayushnv"

    user_data = "./runitup.sh"

    tags = {
        Name = "AyushViaTerraform"
    }
}